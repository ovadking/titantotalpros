
let cart = [];
let total = 0;

function addToCart(item, price) {
    cart.push({ item, price });
    updateCart();
}

function updateCart() {
    const list = document.getElementById('cart-items');
    list.innerHTML = '';
    total = 0;
    cart.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.item} - $${entry.price}`;
        list.appendChild(li);
        total += entry.price;
    });
    document.getElementById('total').textContent = total;
}

function togglePaymentFields(method) {
    const handleLabel = document.getElementById('handle-label');
    const amountLabel = document.getElementById('amount-label');
    if (method) {
        handleLabel.style.display = 'block';
        amountLabel.style.display = 'block';
    } else {
        handleLabel.style.display = 'none';
        amountLabel.style.display = 'none';
    }
}

document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Order submitted! You will receive a confirmation.');
});
