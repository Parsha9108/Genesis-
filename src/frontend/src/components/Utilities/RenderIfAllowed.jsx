import { useSelector } from "react-redux";

const RenderIfAllowed = ({ module, action, children }) => {
  // Get permissions from Redux
  const modulePermissions = useSelector((state) => state.userModPerm?.[module]);
  // console.log("This is the modules permission from the renderifallwoed component",modulePermissions)

  // Check if permission exists
  const hasPermission = modulePermissions?.[action] || false;
  // console.log("This is the modules permission from the renderifallwoed component",hasPermission)

  // Check if permission exists


  // Render only if allowed
  if (!hasPermission) return null;

  return <>{children}</>;
};

export default RenderIfAllowed;
