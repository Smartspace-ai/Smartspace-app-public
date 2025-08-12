import webApi from "../utils/axios-setup";
import { INotificationList } from "../models/notification/notification";

const LIMIT = 10;

export const getNotificationsList = async (
  page = 1,
  isUnreadOnly = false,
): Promise<INotificationList> => {
  const skip = (page - 1) * LIMIT;
  const { data } = await webApi.get(`/Notification`, {
    params: {
      unread: isUnreadOnly,
      skip,
      take: LIMIT,
    },
  });
  return data;
};

export const updateReadNotification = (id: string): Promise<void> => {
  return webApi.put('/Notification/update', [id]);
};

export const updateReadAllNotification = async (): Promise<void> => {
  return webApi.put('/Notification/updateall');
};
