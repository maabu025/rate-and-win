// restaurant.js

document.addEventListener('DOMContentLoaded', () => {
  const restaurantList = document.querySelector('#restaurantList');

  // Sample data — you can replace this with data from an API
  const restaurants = [
    { name: 'Taste of Ghana', location: 'Accra Mall', rating: 4.5 },
    { name: 'Chop Bar Deluxe', location: 'Osu', rating: 4.2 },
    { name: 'Banku Palace', location: 'East Legon', rating: 4.0 },
    { name: 'Jollof Joint', location: 'Tema', rating: 3.8 },
    { name: 'Kelewele Kitchen', location: 'Spintex', rating: 4.6 },
  ];

  if (restaurantList) {
    restaurants.forEach((restaurant, index) => {
      const card = document.createElement('div');
      card.classList.add('restaurant-card', 'card', 'mb-3', 'p-3');

      card.innerHTML = `
        <h5 class="card-title">${restaurant.name}</h5>
        <p class="card-text">Location: ${restaurant.location}</p>
        <p class="card-text">Rating: ⭐ ${restaurant.rating}</p>
        <a href="feedback.html?restaurant=${encodeURIComponent(restaurant.name)}" class="btn btn-primary">Rate Now</a>
      `;

      restaurantList.appendChild(card);
    });
  }
});
