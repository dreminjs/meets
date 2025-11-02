import { createBrowserRouter } from 'react-router-dom';
import { RoomPage } from '../modules/room/';
import { BaseLayout } from './BaseLayout';

export const router = createBrowserRouter([
  {
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        element: <RoomPage />,
      },
    ],
  },
]);
