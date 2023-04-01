const product1 = document.querySelector('.product1');
const product2 = document.querySelector('.product2');
const product3 = document.querySelector('.product3');
const edge1 = document.querySelector('.edge:nth-child(1)');
const edge2 = document.querySelector('.edge:nth-child(2)');
const edge3 = document.querySelector('.edge:nth-child(3)');

product1.addEventListener('mouseover', e => {
  product1.classList.add('highlight');
  product2.classList.add('highlight');
  edge1.classList.add('highlight');
});

product1.addEventListener('mouseout', e => {
  product1.classList.remove('highlight');
  product2.classList.remove('highlight');
  edge1.classList.remove('highlight');
});

product2.addEventListener('mouseover', e => {
  product1.classList.add('highlight');
  product2.classList.add('highlight');
  edge1.classList.add('highlight');
  edge3.classList.add('highlight');
});

product2.addEventListener('mouseout', e => {
  product1.classList.remove('highlight');
  product2.classList.remove('highlight');
  edge1.classList.remove('highlight');
  edge3.classList.remove('highlight');
});

product3.addEventListener('mouseover', e => {
  product2.classList.add('highlight');
  product3.classList.add('highlight');
  edge2.classList.add('highlight');
  edge3.classList.add('highlight');
});

product3.addEventListener('mouseout', e => {
  product2.classList.remove('highlight');
  product3.classList.remove('highlight');
  edge2.classList.remove('highlight');
  edge3.classList.remove('highlight');
});
   