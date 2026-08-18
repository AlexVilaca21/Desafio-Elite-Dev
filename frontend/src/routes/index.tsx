import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/context/AuthContext';
import { RequireAuth } from '@/modules/auth/components/RequireAuth';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import {
  EventCheckoutPage,
  EventDetailPage,
  EventsListPage,
} from '@/modules/events';
import { OrganizerComposePage } from '@/modules/organizer/pages/OrganizerComposePage';
import { OrganizerPage } from '@/modules/organizer/pages/OrganizerPage';
import { GatePage } from '@/modules/gate/pages/GatePage';
import { MyTicketsPage } from '@/modules/tickets/pages/MyTicketsPage';
import { SharedTicketPage } from '@/modules/tickets/pages/SharedTicketPage';
import { AppLayout } from '@/shared/components/Layout/AppLayout';

export function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<EventsListPage />} />
            <Route path="entrar" element={<LoginPage />} />
            <Route path="events/:id" element={<EventDetailPage />} />
            <Route path="events/:id/checkout" element={<EventCheckoutPage />} />
            <Route
              path="organizar"
              element={
                <RequireAuth roles={['ORGANIZER']}>
                  <OrganizerPage />
                </RequireAuth>
              }
            />
            <Route
              path="organizar/novo"
              element={
                <RequireAuth roles={['ORGANIZER']}>
                  <OrganizerComposePage />
                </RequireAuth>
              }
            />
            <Route
              path="organizar/novo/:catalogId"
              element={
                <RequireAuth roles={['ORGANIZER']}>
                  <OrganizerComposePage />
                </RequireAuth>
              }
            />
            <Route
              path="organizar/:eventId/editar"
              element={
                <RequireAuth roles={['ORGANIZER']}>
                  <OrganizerComposePage />
                </RequireAuth>
              }
            />
            <Route
              path="portaria"
              element={
                <RequireAuth roles={['GATE']}>
                  <GatePage />
                </RequireAuth>
              }
            />
            <Route
              path="meus-ingressos"
              element={
                <RequireAuth roles={['CLIENT']}>
                  <MyTicketsPage />
                </RequireAuth>
              }
            />
            <Route
              path="ingressos/compartilhado/:token"
              element={<SharedTicketPage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
