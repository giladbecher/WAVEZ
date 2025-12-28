// Shared data store for the mobile app
let sharedData = {
  data: [],
  selectedBeach: null,
  availableBeaches: [],
  loading: true,
  listeners: []
};

// Subscribe to data changes
export const subscribeToData = (callback) => {
  sharedData.listeners.push(callback);
  return () => {
    sharedData.listeners = sharedData.listeners.filter(listener => listener !== callback);
  };
};

// Notify all listeners of data changes
const notifyListeners = () => {
  sharedData.listeners.forEach(callback => callback(sharedData));
};

// Update data
export const updateSharedData = (newData) => {
  sharedData = { ...sharedData, ...newData };
  notifyListeners();
};

// Get current data
export const getSharedData = () => sharedData;
