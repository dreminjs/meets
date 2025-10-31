import { createBrowserRouter } from 'react-router-dom';
import { RoomPage } from '../modules/room/';
import { JoinRoomPage } from '../modules/room/ui/rooms/JoinRoomPage';
import { BaseLayout } from './BaseLayout';

export const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <JoinRoomPage />,
      },
      {
        path: '/room/:roomId',
        element: <RoomPage />,
      },
    ],
  },
]);
