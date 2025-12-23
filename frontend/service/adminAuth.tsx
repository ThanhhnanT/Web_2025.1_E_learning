import { post } from "@/helper/api";

export const handleAdminLogin = async (data: {
  email: string;
  password: string;
}) => {
  const res = await post("auth/admin/login", data);
  return res;
};

