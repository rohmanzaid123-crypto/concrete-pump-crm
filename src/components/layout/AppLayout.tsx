import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardPage } from '../../pages/Dashboard/DashboardPage';
import { SettingsPage } from '../../pages/Settings/SettingsPage';
import { CustomersPage } from '../../pages/Customers/CustomersPage';
import { LeadsPage } from '../../pages/Leads/LeadsPage';
import { FleetPage } from '../../pages/Fleet/FleetPage';
import { BookingsPage } from '../../pages/Bookings/BookingsPage';
import { SchedulingPage } from '../../pages/Scheduling/SchedulingPage';
import { QuotationsPage } from '../../pages/Quotations/QuotationsPage';
import { InvoicesPage } from '../../pages/Invoices/InvoicesPage';
import { FinancePage } from '../../pages/Finance/FinancePage';
import { ReportsPage } from '../../pages/Reports/ReportsPage';
import { WhatsAppPage } from '../../pages/WhatsApp/WhatsAppPage';
import { AIAssistantPage } from '../../pages/AIAssistant/AIAssistantPage';
import { ModulePlaceholder } from '../../pages/ModulePlaceholder';

export const AppLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={(tab) => setCurrentTab(tab)} />;
      case 'bookings':
        return <BookingsPage />;
      case 'scheduling':
        return <SchedulingPage />;
      case 'fleet':
        return <FleetPage />;
      case 'customers':
        return <CustomersPage />;
      case 'leads':
        return <LeadsPage />;
      case 'quotations':
        return <QuotationsPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'finance':
        return <FinancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'whatsapp':
        return <WhatsAppPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <ModulePlaceholder
            moduleId={currentTab}
            onNavigateHome={() => setCurrentTab('dashboard')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      {/* Enterprise Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tabId) => setCurrentTab(tabId)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header with Breadcrumbs, Supabase Status & Role */}
        <Header
          currentTab={currentTab}
          onNavigateToSettings={() => setCurrentTab('settings')}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
