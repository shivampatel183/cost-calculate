import React from "react";

const Profile = ({ user }) => (
  <div className="p-8">
    👤 Logged in as <strong>{user.email}</strong>
  </div>
);

export default Profile;
