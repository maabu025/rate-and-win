import { saveToStorage, getFromStorage } from './storage.js';

// Save user points
saveToStorage('userPoints', 150);

// Get user points
const points = getFromStorage('userPoints');

// Remove token
removeFromStorage('authToken');
