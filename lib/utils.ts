export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString();
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 border-red-200";
    case "medium":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    default:
      return "text-green-600 bg-green-50 border-green-200";
  }
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case "academic":
      return "bg-blue-100 text-blue-800";
    case "events":
      return "bg-purple-100 text-purple-800";
    case "facilities":
      return "bg-green-100 text-green-800";
    case "announcements":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
