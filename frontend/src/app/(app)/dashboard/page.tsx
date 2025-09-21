'use client';

import { useState } from 'react';
import { DashboardHeader } from './components/dashboard-header';
import { SearchBar } from './components/search-bar';
import { MarketTabs } from './components/market-tabs';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8">
      <DashboardHeader />
      
      <div className="space-y-6">
        <SearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        
        <MarketTabs 
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
