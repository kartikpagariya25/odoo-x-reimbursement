import axiosInstance from "../utils/axiosInstance";

const API_URL = "/api/rules";

const unwrapData = (response) => {
	if (response?.data?.data !== undefined) {
		return response.data.data;
	}

	return response?.data;
};

export const ruleService = {
	getAllRules: async () => {
		const response = await axiosInstance.get(API_URL);
		return unwrapData(response);
	},

	createRule: async (payload) => {
		const response = await axiosInstance.post(API_URL, payload);
		return unwrapData(response);
	},

	updateRule: async (id, payload) => {
		const response = await axiosInstance.patch(`${API_URL}/${id}`, payload);
		return unwrapData(response);
	},

	deleteRule: async (id) => {
		const response = await axiosInstance.delete(`${API_URL}/${id}`);
		return unwrapData(response);
	},
};
