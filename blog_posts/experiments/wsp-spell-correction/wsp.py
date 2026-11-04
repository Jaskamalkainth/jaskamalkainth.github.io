"""Weight-space programming tools: read activations, write edits straight into weights.

No gradients anywhere. Every edit is a closed-form change to named weight tensors,
chosen by reasoning about what the tensor computes, and logged with the exact number
of weights it touched.
"""
import torch
import common as c

# Few-shot examples that put the model into "copy-editor" mode. None of these words
# occur in dev.jsonl or test.jsonl.
SHOTS = [("tabel lamp", "table lamp"), ("sofa", "sofa"),
         ("mobil covr for iphone", "mobile cover for iphone"), ("yoga matt", "yoga mat"),
         ("wodden dining tabel", "wooden dining table")]


def fewshot_prompt(tok, q):
    m = [{"role": "system", "content": c.SYSTEM}]
    for a, b in SHOTS:
        m += [{"role": "user", "content": a}, {"role": "assistant", "content": b}]
    m.append({"role": "user", "content": q})
    return tok.apply_chat_template(m, tokenize=False, add_generation_prompt=True)


@torch.no_grad()
def last_token_states(tok, model, queries, prompt_fn, bs=50):
    """Mean residual stream at the last prompt token, for every layer. One batched pass per 50 queries."""
    total = None
    for i in range(0, len(queries), bs):
        enc = tok([prompt_fn(tok, q) for q in queries[i:i + bs]], return_tensors="pt", padding=True)
        hs = model(**enc, output_hidden_states=True).hidden_states
        s = torch.stack([h[:, -1].sum(0) for h in hs])          # [layers+1, hidden]
        total = s if total is None else total + s
        c.FORWARD_PASSES += 1
    return total / len(queries)


def vbias_map(model, layer):
    """Matrix M (hidden x 128) with: adding b to layer's v_proj bias adds M @ b to the residual stream.

    Attention weights over a row sum to 1, so a constant added to every value vector
    passes through attention unchanged and comes out as o_proj(b repeated per head group).
    """
    attn = model.model.layers[layer].self_attn
    cfg = model.config
    hd = cfg.hidden_size // cfg.num_attention_heads
    group = cfg.num_attention_heads // cfg.num_key_value_heads
    Wo = attn.o_proj.weight                                       # [hidden, heads*hd]
    M = torch.zeros(cfg.hidden_size, cfg.num_key_value_heads * hd)
    for h in range(cfg.num_attention_heads):
        g = h // group
        M[:, g * hd:(g + 1) * hd] += Wo[:, h * hd:(h + 1) * hd]
    return M


@torch.no_grad()
def write_vector(model, layers, vec):
    """Compile a constant residual-stream vector into the v_proj biases of `layers`.

    Solves min ||sum_l M_l b_l - vec|| jointly (least squares) and adds b_l to each bias.
    Returns (weights changed, fraction of vec's norm that could not be written).
    """
    Ms = [vbias_map(model, l) for l in layers]
    M = torch.cat(Ms, 1)
    b = torch.linalg.lstsq(M, vec[:, None]).solution[:, 0]
    k = 0
    for l, Ml in zip(layers, Ms):
        n = Ml.shape[1]
        model.model.layers[l].self_attn.v_proj.bias += b[k:k + n]
        k += n
    miss = (M @ b - vec).norm() / vec.norm()
    return k, miss.item()


@torch.no_grad()
def query_attention_mass(tok, model_eager, data, bs=50):
    """[layers, heads] mean attention mass from answer tokens onto the user's query tokens.

    Teacher-forced on the correct answers: heads with high mass are the ones that read the
    query while the model writes the answer, i.e. the copy path of a spell checker.
    """
    cfg = model_eager.config
    mass = torch.zeros(cfg.num_hidden_layers, cfg.num_attention_heads)
    side, tok.padding_side = tok.padding_side, "right"
    for i in range(0, len(data), bs):
        texts, spans = [], []
        for r in data[i:i + bs]:
            p = c.prompt(tok, r["query"])
            a = p.index(r["query"])
            qs, qe = len(tok(p[:a]).input_ids), len(tok(p[:a + len(r["query"])]).input_ids)
            full = p + r["target"] + "<|im_end|>"
            texts.append(full)
            spans.append((qs, qe, len(tok(p).input_ids), len(tok(full).input_ids)))
        out = model_eager(**tok(texts, return_tensors="pt", padding=True), output_attentions=True)
        c.FORWARD_PASSES += 1
        for b, (qs, qe, ps, fe) in enumerate(spans):
            for L, A in enumerate(out.attentions):
                mass[L] += A[b, :, ps - 1:fe - 1, qs:qe].sum(-1).mean(-1)
    tok.padding_side = side
    return mass / len(data)


@torch.no_grad()
def scale_heads(model, heads, gain):
    """Multiply what each (layer, head) writes into the residual stream by `gain`.

    A head's output enters the residual stream through its 64-column block of o_proj,
    so scaling that block scales the head's contribution and nothing else.
    """
    hd = model.config.hidden_size // model.config.num_attention_heads
    for L, h in heads:
        model.model.layers[L].self_attn.o_proj.weight[:, h * hd:(h + 1) * hd] *= gain
    return len(heads) * model.config.hidden_size * hd
