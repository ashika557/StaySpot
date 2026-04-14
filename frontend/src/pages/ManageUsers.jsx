import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Users, Loader2 } from "lucide-react";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminService.getUsers();
        setUsers(data || []);
      } catch (error) {
        console.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded-full">
                {user.role}
              </span>
              <span
                className={
                  user.is_active
                    ? "text-emerald-500 font-bold text-xs"
                    : "text-rose-500 font-bold text-xs"
                }
              >
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
