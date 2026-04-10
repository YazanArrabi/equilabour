import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import WorkerProfilePage from "@/pages/workers/WorkerProfilePage";
import WorkerPublicProfilePage from "@/pages/workers/WorkerPublicProfilePage";
import WorkersPage from "@/pages/workers/WorkersPage";
import CompanyProfilePage from "@/pages/companies/CompanyProfilePage";
import CompanyPublicProfilePage from "@/pages/companies/CompanyPublicProfilePage";
import JobListingsPage from "@/pages/jobs/JobListingsPage";
import JobDetailPage from "@/pages/jobs/JobDetailPage";
import CreateJobPage from "@/pages/jobs/CreateJobPage";
import EditJobPage from "@/pages/jobs/EditJobPage";
import MyJobsPage from "@/pages/jobs/MyJobsPage";
import JobApplicationsPage from "@/pages/jobs/JobApplicationsPage";
import MyApplicationsPage from "@/pages/applications/MyApplicationsPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // Any authenticated user
      {
        element: <ProtectedRoute />,
        children: [
          { path: "jobs", element: <JobListingsPage /> },
          { path: "jobs/:jobId", element: <JobDetailPage /> },
          { path: "workers", element: <WorkersPage /> },
          { path: "workers/:workerId", element: <WorkerPublicProfilePage /> },
          {
            path: "companies/:companyId",
            element: <CompanyPublicProfilePage />,
          },
        ],
      },

      // Worker only
      {
        element: <ProtectedRoute roles={["worker"]} />,
        children: [
          { path: "workers/me", element: <WorkerProfilePage /> },
          { path: "applications/me", element: <MyApplicationsPage /> },
        ],
      },

      // Company only
      {
        element: <ProtectedRoute roles={["company"]} />,
        children: [
          { path: "companies/me", element: <CompanyProfilePage /> },
          { path: "jobs/new", element: <CreateJobPage /> },
          { path: "jobs/mine", element: <MyJobsPage /> },
          { path: "jobs/:jobId/edit", element: <EditJobPage /> },
          { path: "jobs/:jobId/applications", element: <JobApplicationsPage /> },
        ],
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
