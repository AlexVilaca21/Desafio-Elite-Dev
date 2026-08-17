import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  EventCheckoutPage,
  EventDetailPage,
  EventsListPage,
} from '@/modules/events';
import { AppLayout } from '@/shared/components/Layout/AppLayout';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<EventsListPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="events/:id/checkout" element={<EventCheckoutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
