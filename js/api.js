// api.js

const API_BASE_URL = 'https://mockapi.io/api/v1'; // Replace with real backend endpoint if available

// Submit feedback
export async function submitFeedback(feedbackData) {
  try {
    const response = await fetch(`${API_BASE_URL}/feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    return await response.json();
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

// Fetch user rewards
export async function fetchRewards(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/rewards`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching rewards:', error);
    throw error;
  }
}

// Fetch restaurant list
export async function fetchRestaurants() {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    throw error;
  }
}

// Redeem a reward
export async function redeemReward(userId, rewardId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rewardId })
    });

    return await response.json();
  } catch (error) {
    console.error('Error redeeming reward:', error);
    throw error;
  }
}
