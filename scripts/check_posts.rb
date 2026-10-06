#!/usr/bin/env ruby
# Checks blog posts against the SEO / AEO / GEO rules in AGENTS.md.
#
#   ruby scripts/check_posts.rb                       # every post under blog_posts/
#   ruby scripts/check_posts.rb blog_posts/foo.md     # just the posts you touched
#   ruby scripts/check_posts.rb --site /tmp/site ...  # also check the built HTML (run `jekyll build -d /tmp/site` first)
#
# Exits 1 if any ERROR is found. WARNs are worth reading but don't fail the run.
# Uses only the Ruby standard library (Ruby ships with Jekyll), so no Gemfile is needed.

require "yaml"
require "date"
require "json"
require "cgi"

ROOT = File.expand_path("..", __dir__)
Dir.chdir(ROOT)

DESC_MIN, DESC_MAX, DESC_IDEAL = 70, 170, 160
TITLE_WARN = 70
SUMMARY_RE = %r{(\*\*|<strong>)(In short|Quick answer|Short answer):?(\*\*|</strong>)}i

def front_matter(path)
  text = File.read(path, encoding: "UTF-8")
  return [nil, text] unless text.start_with?("---")
  _, fm, body = text.split(/^---\s*$/, 3)
  data = YAML.safe_load(fm, permitted_classes: [Date, Time], aliases: true) || {}
  [data, body.to_s]
rescue Psych::Exception => e
  [{ "__yaml_error" => e.message }, ""]
end

def to_date(v)
  case v
  when Date then v.to_date
  when Time then v.to_date
  when String then (Date.parse(v) rescue nil)
  end
end

# Markdown with fenced code blocks removed, so "# comment" lines in code don't count as headings.
def prose(body)
  body.gsub(/^(```|~~~).*?^\1/m, "")
end

def url_to_source(url)
  path = url.sub(%r{^/}, "").sub(/\.html$/, "")
  ["#{path}.md", "#{path}.html", "#{path}/index.html", "#{path}index.html"].find { |p| File.exist?(p) }
end

args = ARGV.dup
site_dir = (i = args.index("--site")) ? File.expand_path(args.delete_at(i + 1).to_s, Dir.pwd).tap { args.delete_at(i) } : nil
site_tagline = YAML.safe_load(File.read("_config.yml", encoding: "UTF-8"), permitted_classes: [Date, Time])["description"].to_s
targets = args.empty? ? Dir["blog_posts/**/*.md"] : args
targets = targets.reject { |p| File.basename(p).start_with?("_") || p.include?("/experiments/") || File.basename(p) =~ /^(README|template)\.md$/ }

all_posts = Dir["blog_posts/**/*.md"].reject { |p| File.basename(p).start_with?("_") || p.include?("/experiments/") }
  .map { |p| [p, front_matter(p).first] }
  .select { |_, d| d && d["published"] != false }
homepage = File.read("_data/work_beyond.yml", encoding: "UTF-8")

errors = warns = 0
targets.sort.each do |path|
  data, body = front_matter(path)
  next if data.nil? || data["published"] == false
  out = []
  err = ->(m) { out << "  ERROR #{m}"; errors += 1 }
  warn = ->(m) { out << "  WARN  #{m}"; warns += 1 }

  if data["__yaml_error"]
    err.("front matter is not valid YAML: #{data["__yaml_error"]}")
    puts path, out
    next
  end

  # --- identity ---
  title = data["title"].to_s
  err.("missing title") if title.empty?
  warn.("title is #{title.length} chars; search results cut off around #{TITLE_WARN} (\" | Jaskamal Kainth\" is appended)") if title.length > TITLE_WARN

  desc = data["description"].to_s
  if desc.empty?
    err.("missing description (the page would fall back to the site tagline)")
  elsif desc.length < DESC_MIN || desc.length > DESC_MAX
    err.("description is #{desc.length} chars; keep it #{DESC_MIN}-#{DESC_IDEAL}")
  elsif desc.length > DESC_IDEAL
    warn.("description is #{desc.length} chars; Google usually truncates past ~#{DESC_IDEAL}")
  end

  # --- dates ---
  pub = to_date(data["date"])
  mod = to_date(data["last_modified_at"])
  err.("missing or unparseable date") unless pub
  err.("missing last_modified_at (needed for the sitemap's <lastmod> and the \"Updated\" byline)") unless mod
  err.("last_modified_at is before date") if pub && mod && mod < pub
  err.("last_modified_at is in the future") if mod && mod > Date.today + 1

  # --- discovery ---
  kw = data["keywords"]
  if !kw.is_a?(Array) || kw.empty?
    err.("keywords must be a non-empty YAML list")
  elsif kw.size > 10
    warn.("#{kw.size} keywords; 4-8 focused ones is plenty")
  end

  if data["image"] && !File.exist?(data["image"].to_s.sub(%r{^/}, ""))
    err.("image #{data["image"]} does not exist")
  end

  Array(data["related"]).each do |u|
    err.("related link #{u} does not match any page") unless url_to_source(u)
  end
  warn.("no related: links (add 2-3 posts on nearby topics)") if Array(data["related"]).empty? && !path.include?("CppNotesDb/")

  url = "/" + path.sub(/\.md$/, ".html")
  unless path.include?("CppNotesDb/") || homepage.include?(url)
    warn.("not linked from the homepage; add an entry to _data/work_beyond.yml")
  end

  # --- answer-engine structure ---
  text = prose(body)
  h1s = text.scan(/^#\s+\S/).size + text.scan(/<h1[\s>]/i).size
  err.("found #{h1s} H1 headings; a post needs exactly one") unless h1s == 1
  if text =~ /^#####\s/ || (text =~ /^####\s/ && text !~ /^###\s/)
    warn.("heading levels skip (e.g. H1 straight to H4); use ## then ###")
  end

  faq = data["faq"]
  if faq
    if !faq.is_a?(Array) || faq.any? { |f| !f.is_a?(Hash) || f["q"].to_s.empty? || f["a"].to_s.empty? }
      err.("every faq item needs a non-empty q and a")
    else
      faq.each { |f| warn.("FAQ question should end with '?': #{f["q"]}") unless f["q"].strip.end_with?("?") }
      warn.("#{faq.size} FAQ items; 3-5 is the sweet spot") unless (2..6).cover?(faq.size)
    end
  end

  unless body =~ SUMMARY_RE || path.include?("CppNotesDb/") || body.include?("problem_list.html")
    warn.("no direct-answer summary near the top (> **In short:** ...)")
  end

  # --- media & embeds ---
  body.scan(/<img\b[^>]*>/i).each do |tag|
    err.("<img> without alt text: #{tag[0, 80]}") unless tag =~ /\balt="[^"]+"/
  end
  body.scan(/!\[([^\]]*)\]\(([^)]+)\)/).each do |alt, src|
    err.("markdown image without alt text: #{src}") if alt.strip.empty?
  end
  body.scan(/<iframe\b[^>]*>/i).each do |tag|
    err.("<iframe> needs a title attribute: #{tag[0, 80]}") unless tag =~ /\btitle="/
    warn.("<iframe> should have loading=\"lazy\"") unless tag =~ /loading="lazy"/
  end

  # --- math ---
  if text =~ /\$\$|\\\(|\\\[/ && !data["math"]
    err.("post contains LaTeX but not `math: true`, so formulas render as raw text")
  end

  # --- internal links ---
  body.scan(%r{\]\((/[^)\s#]+)}).flatten.concat(body.scan(%r{href="(/[^"#]+)"}).flatten).uniq.each do |u|
    next if u.include?("{{")
    err.("broken internal link #{u}") unless url_to_source(u) || File.exist?(u.sub(%r{^/}, ""))
  end

  # --- built output (optional) ---
  if site_dir
    html_path = File.join(site_dir, path.sub(/\.md$/, ".html"))
    if !File.exist?(html_path)
      err.("not in the build: #{html_path}")
    else
      html = File.read(html_path, encoding: "UTF-8")
      meta = html[/<meta name="description" content="([^"]*)"/, 1]
      err.("built page has no meta description") unless meta
      err.("built meta description is the site tagline, not the post's") if meta && CGI.unescapeHTML(meta) == site_tagline
      html.scan(%r{<script type="application/ld\+json">(.*?)</script>}m).flatten.each do |block|
        begin
          JSON.parse(block)
        rescue JSON::ParserError => e
          err.("invalid JSON-LD in built page: #{e.message[0, 100]}")
        end
      end
      url = "https://jaskamalkainth.github.io/" + path.sub(/\.md$/, ".html")
      sitemap = File.read(File.join(site_dir, "sitemap.xml"), encoding: "UTF-8") rescue ""
      entry = sitemap[%r{<loc>#{Regexp.escape(url)}</loc>\s*(<lastmod>)?}]
      err.("missing from sitemap.xml") unless entry
      err.("sitemap entry has no <lastmod>") if entry && !entry.include?("<lastmod>")
      llms = File.read(File.join(site_dir, "llms.txt"), encoding: "UTF-8") rescue ""
      err.("missing from llms.txt") unless llms.include?(url)
    end
  end

  puts(path, out) unless out.empty?
end

# --- site-wide uniqueness ---
%w[title description].each do |field|
  all_posts.group_by { |_, d| d[field].to_s.strip.downcase }.each do |val, group|
    next if val.empty? || group.size < 2
    puts "ERROR duplicate #{field} \"#{val}\" in: #{group.map(&:first).join(", ")}"
    errors += 1
  end
end

puts "", "#{targets.size} file(s) checked: #{errors} error(s), #{warns} warning(s)"
exit(errors.zero? ? 0 : 1)
