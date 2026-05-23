"use client";

import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(1);

  // Sync with session storage and randomize only on client to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = sessionStorage.getItem("ghost_name");
      const savedAvatar = sessionStorage.getItem("ghost_avatar");
      
      if (savedName) setName(savedName);
      
      if (savedAvatar) {
        setAvatar(parseInt(savedAvatar));
      } else {
        // Assign random avatar if not exists
        const randomAvatar = Math.floor(Math.random() * 6) + 1;
        setAvatar(randomAvatar);
        if (savedName) {
          sessionStorage.setItem("ghost_avatar", randomAvatar.toString());
        }
      }
    }
  }, []);

  const updateName = (newName) => {
    setName(newName);
    sessionStorage.setItem("ghost_name", newName);
    
    // Assign avatar if not already set
    if (!sessionStorage.getItem("ghost_avatar")) {
      const randomAvatar = Math.floor(Math.random() * 6) + 1;
      setAvatar(randomAvatar);
      sessionStorage.setItem("ghost_avatar", randomAvatar.toString());
    }
  };

  const getAvatarUrl = (id) => {
    return `/assets/avatars/${id}.png`;
  };

  const logout = () => {
    setName("");
    setAvatar(1);
    sessionStorage.removeItem("ghost_name");
    sessionStorage.removeItem("ghost_avatar");
  };

  return (
    <UserContext.Provider value={{ name, avatar, updateName, logout, avatarUrl: getAvatarUrl(avatar) }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
