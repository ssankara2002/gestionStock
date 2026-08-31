import apiClient from "./api-client"

const USER_API_URL = "/users"

const getAll = () => {
  return apiClient.get(USER_API_URL)
}

const create = (data: any) => {
  return apiClient.post(USER_API_URL, data)
}

export const userService = {
  getAll,
  create,
}