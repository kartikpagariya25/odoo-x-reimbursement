import axiosInstance from "../utils/axiosInstance";

const API_URL = "/api/expenses";

const unwrapData = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  return response?.data;
};

export const expenseService = {
  /**
   * Get all expenses for the current user
   * @returns {Promise<Array>} List of expenses
   */
  getMyExpenses: async () => {
    const response = await axiosInstance.get(API_URL);
    return unwrapData(response);
  },

  /**
   * Get a single expense by ID
   * @param {string} id - Expense ID
   * @returns {Promise<Object>} Expense details
   */
  getExpenseById: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return unwrapData(response);
  },

  /**
   * Create a new expense
   * @param {FormData} expenseData - Expense data including receipt file
   * @returns {Promise<Object>} Created expense
   */
  createExpense: async (expenseData) => {
    const response = await axiosInstance.post(API_URL, expenseData);
    return unwrapData(response);
  },

  /**
   * Update an expense
   * @param {string} id - Expense ID
   * @param {Object} expenseData - Updated expense data
   * @returns {Promise<Object>} Updated expense
   */
  updateExpense: async (id, expenseData) => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, expenseData);
    return unwrapData(response);
  },

  /**
   * Delete an expense
   * @param {string} id - Expense ID
   * @returns {Promise<void>}
   */
  deleteExpense: async (id) => {
    await axiosInstance.delete(`${API_URL}/${id}`);
  },

  /**
   * Get expenses with pagination and filters
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Paginated expenses
   */
  getExpensesWithFilters: async (params) => {
    const response = await axiosInstance.get(`${API_URL}/all`, { params });
    return unwrapData(response);
  },

  getAllExpenses: async (params = {}) => {
    const response = await axiosInstance.get(`${API_URL}/all`, { params });
    return unwrapData(response);
  },

  overrideExpense: async (id, payload) => {
    const response = await axiosInstance.post(`${API_URL}/${id}/override`, payload);
    return unwrapData(response);
  },

  getExpenseAuditTrail: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}/audit`);
    return unwrapData(response);
  },
};
