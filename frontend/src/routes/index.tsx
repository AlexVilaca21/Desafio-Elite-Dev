import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { EventsListPage } from '@/modules/events';
import { AppLayout } from '@/shared/components/Layout/AppLayout';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<EventsListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
