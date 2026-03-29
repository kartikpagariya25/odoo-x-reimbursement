import axiosInstance from "../utils/axiosInstance";

const API_URL = "/api/users";

const unwrapData = (response) => {
	if (response?.data?.data !== undefined) {
		return response.data.data;
	}

	return response?.data;
};

export const userService = {
	getAllUsers: async () => {
		const response = await axiosInstance.get(API_URL);
		return unwrapData(response);
	},

	createUser: async (payload) => {
		const response = await axiosInstance.post(API_URL, payload);
		return unwrapData(response);
	},

	updateUser: async (userId, payload) => {
		const response = await axiosInstance.patch(`${API_URL}/${userId}`, payload);
		return unwrapData(response);
	},

	deleteUser: async (userId) => {
		const response = await axiosInstance.delete(`${API_URL}/${userId}`);
		return unwrapData(response);
	},

	sendPassword: async (userId) => {
		const response = await axiosInstance.post(`${API_URL}/${userId}/send-password`);
		return unwrapData(response);
	},
};
