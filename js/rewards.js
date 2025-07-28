// rewards.js

document.addEventListener('DOMContentLoaded', () => {
  const rewardsContainer = document.getElementById('rewardsContainer');
  const pointsDisplay = document.getElementById('userPoints');

  // Simulated user points (you can fetch this from localStorage or API)
  let userPoints = parseInt(localStorage.getItem('userPoints')) || 120;

  // Sample reward data
  const rewards = [
    { id: 1, name: 'Free Drink', cost: 50 },
    { id: 2, name: '10% Off Next Meal', cost: 100 },
    { id: 3, name: 'Free Dessert', cost: 80 },
    { id: 4, name: 'GHS 10 Voucher', cost: 120 }
  ];

  // Display user points
  if (pointsDisplay) {
    pointsDisplay.textContent = `Your Points: ${userPoints}`;
  }

  // Render reward cards
  rewards.forEach(reward => {
    const card = document.createElement('div');
    card.className = 'card reward-card p-3 mb-3';

    card.innerHTML = `
      <h5 class="card-title">${reward.name}</h5>
      <p class="card-text">Cost: ${reward.cost} points</p>
      <button class="btn btn-success redeem-btn" data-id="${reward.id}" ${userPoints < reward.cost ? 'disabled' : ''}>
        Redeem
      </button>
    `;

    rewardsContainer.appendChild(card);
  });

  // Handle redeem button click
  rewardsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('redeem-btn')) {
      const rewardId = parseInt(e.target.getAttribute('data-id'));
      const reward = rewards.find(r => r.id === rewardId);

      if (reward && userPoints >= reward.cost) {
        userPoints -= reward.cost;
        localStorage.setItem('userPoints', userPoints);
        alert(`Successfully redeemed: ${reward.name}`);
        window.location.reload(); // Reload to update points and buttons
      } else {
        alert('Not enough points to redeem this reward.');
      }
    }
  });
});
