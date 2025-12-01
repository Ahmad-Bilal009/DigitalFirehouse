import axios from 'axios';
import * as Keychain from 'react-native-keychain';

const BASE_URL = 'https://app.digitalfirehouse.com';

const api = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000,
});

api.interceptors.request.use(
    async (config) => {
        try {
            // Get bearer token from Keychain
            const credentials = await Keychain.getGenericPassword();
            if (credentials && credentials.password) {
                config.headers.Authorization = `Bearer ${credentials.password}`;
            }
        } catch (error) {
            console.error('Error retrieving token from Keychain:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Authentication failed (401). Clearing token and redirecting to login.');
            try {
                // Clear bearer token from Keychain
                await Keychain.resetGenericPassword();
                console.log('Authentication token cleared from Keychain.');
            } catch (keychainError) {
                console.error('Error clearing token from Keychain:', keychainError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
