import React, { useState } from 'react';

// ============================================
// 1. GLOBAL SEARCH COMPONENT
// ============================================

export function GlobalSearchTab({ apiCall }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      alert('Please enter at least 2 characters to search');
      return;
    }

    setIsSearching(true);
    try {
      const data = await apiCall(`/admin/global-search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data);
    } catch (error) {
      alert('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🔍 Global Search</h2>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          Search across VCSE Organizations, Schools/Care Organizations, and Local Shops by name, email, town, ID, or registration number.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter search query..."
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '5px'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              padding: '12px 30px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {searchResults && (
        <div>
          <h3 style={{ marginBottom: '15px' }}>
            Search Results ({searchResults.total_count} found)
          </h3>

          {/* VCSE Organizations */}
          {searchResults.results.vcse.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ color: '#4CAF50', marginBottom: '15px' }}>
                🤝 VCSE Organizations ({searchResults.results.vcse.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>City</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Charity #</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.results.vcse.map((org) => (
                      <tr key={org.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{org.name}</td>
                        <td style={{ padding: '10px' }}>{org.email}</td>
                        <td style={{ padding: '10px' }}>{org.city}</td>
                        <td style={{ padding: '10px' }}>{org.charity_number}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                          £{org.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Schools */}
          {searchResults.results.schools.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ color: '#2196F3', marginBottom: '15px' }}>
                🎓 Schools/Care Organizations ({searchResults.results.schools.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>City</th>
                      <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.results.schools.map((school) => (
                      <tr key={school.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{school.name}</td>
                        <td style={{ padding: '10px' }}>{school.email}</td>
                        <td style={{ padding: '10px' }}>{school.city}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                          £{school.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shops */}
          {searchResults.results.shops.length > 0 && (
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ color: '#FF9800', marginBottom: '15px' }}>
                🏪 Local Shops ({searchResults.results.shops.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Shop Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Town</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Address</th>
                      <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.results.shops.map((shop) => (
                      <tr key={shop.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '10px' }}>{shop.name}</td>
                        <td style={{ padding: '10px' }}>{shop.town}</td>
                        <td style={{ padding: '10px' }}>{shop.address}</td>
                        <td style={{ padding: '10px' }}>{shop.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {searchResults.total_count === 0 && (
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '18px', color: '#666' }}>No results found for "{searchResults.query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ============================================
// 2. TRANSACTION SEARCH COMPONENT
// ============================================

export function TransactionSearchTab({ apiCall }) {
  const [filters, setFilters] = useState({
    shop_name: '',
    shop_id: '',
    town: '',
    start_date: '',
    end_date: '',
    transaction_type: 'all',
    recipient_name: '',
    voucher_id: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const data = await apiCall(`/admin/transactions/search?${params.toString()}`);
      setTransactions(data.transactions || []);
    } catch (error) {
      alert('Search failed: ' + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const data = await apiCall('/admin/transactions/export', {
        method: 'POST',
        body: JSON.stringify({
          transactions,
          format
        })
      });

      // Convert to CSV and download
      if (format === 'csv') {
        const csv = convertToCSV(transactions);
        downloadFile(csv, 'transactions.csv', 'text/csv');
      }
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value}"`;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>📊 Transaction & Shop Data Search</h2>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>Search Filters</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Shop Name</label>
            <input
              type="text"
              value={filters.shop_name}
              onChange={(e) => setFilters({ ...filters, shop_name: e.target.value })}
              placeholder="Enter shop name..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Town</label>
            <select
              value={filters.town}
              onChange={(e) => setFilters({ ...filters, town: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <option value="">All Towns</option>
              <option value="Wellingborough">Wellingborough</option>
              <option value="Kettering">Kettering</option>
              <option value="Corby">Corby</option>
              <option value="Northampton">Northampton</option>
              <option value="Daventry">Daventry</option>
              <option value="Brackley">Brackley</option>
              <option value="Towcester">Towcester</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Transaction Type</label>
            <select
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            >
              <option value="all">All Types</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="reissued">Reissued</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Recipient Name</label>
            <input
              type="text"
              value={filters.recipient_name}
              onChange={(e) => setFilters({ ...filters, recipient_name: e.target.value })}
              placeholder="Enter recipient name..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Voucher ID</label>
            <input
              type="text"
              value={filters.voucher_id}
              onChange={(e) => setFilters({ ...filters, voucher_id: e.target.value })}
              placeholder="Enter voucher ID..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              padding: '12px 30px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isSearching ? 'Searching...' : 'Search Transactions'}
          </button>

          <button
            onClick={() => setFilters({
              shop_name: '',
              shop_id: '',
              town: '',
              start_date: '',
              end_date: '',
              transaction_type: 'all',
              recipient_name: '',
              voucher_id: ''
            })}
            style={{
              padding: '12px 30px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {transactions.length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Results ({transactions.length} transactions)</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleExport('csv')}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Export CSV
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Voucher Code</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Shop</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Town</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Recipient</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{tx.transaction_id}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{tx.voucher_code}</td>
                    <td style={{ padding: '10px' }}>{tx.shop_name}</td>
                    <td style={{ padding: '10px' }}>{tx.town}</td>
                    <td style={{ padding: '10px' }}>{tx.recipient_name}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                      £{tx.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px' }}>
                      {tx.date ? new Date(tx.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: tx.status === 'redeemed' ? '#4CAF50' : tx.status === 'active' ? '#2196F3' : '#FF9800',
                        color: 'white'
                      }}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================
// 3. BROADCAST MESSAGING COMPONENT
// ============================================

export function BroadcastTab({ apiCall }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audiences, setAudiences] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleAudienceToggle = (audience) => {
    if (audiences.includes(audience)) {
      setAudiences(audiences.filter(a => a !== audience));
    } else {
      setAudiences([...audiences, audience]);
    }
  };

  const handleSend = async () => {
    if (!title || !body) {
      alert('Please enter both title and message body');
      return;
    }

    if (audiences.length === 0) {
      alert('Please select at least one audience');
      return;
    }

    if (!confirm(`Send this message to ${audiences.join(', ')}?`)) {
      return;
    }

    setIsSending(true);
    try {
      const data = await apiCall('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title,
          body,
          audiences
        })
      });

      alert(`Message sent successfully!\nSent: ${data.sent_count}\nFailed: ${data.failed_count}`);
      
      // Clear form
      setTitle('');
      setBody('');
      setAudiences([]);
    } catch (error) {
      alert('Failed to send broadcast: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>📢 Broadcast Messaging</h2>

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px' }}>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Send announcements and important messages to all users in selected groups.
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter message title..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Message Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message..."
            rows="8"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Select Audience</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { id: 'vcse', label: '🤝 VCSE Organizations', color: '#4CAF50' },
              { id: 'school', label: '🎓 Schools/Care Orgs', color: '#2196F3' },
              { id: 'vendor', label: '🏪 Local Shops', color: '#FF9800' },
              { id: 'recipient', label: '👥 Recipients', color: '#9C27B0' }
            ].map(({ id, label, color }) => (
              <div
                key={id}
                onClick={() => handleAudienceToggle(id)}
                style={{
                  padding: '15px',
                  border: `2px solid ${audiences.includes(id) ? color : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: audiences.includes(id) ? `${color}15` : 'white',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: audiences.includes(id) ? color : '#666' }}>
                  {label}
                </div>
                {audiences.includes(id) && (
                  <div style={{ marginTop: '5px', color: color, fontWeight: 'bold' }}>✓ Selected</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isSending}
          style={{
            padding: '15px 40px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isSending ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {isSending ? 'Sending...' : 'Send Broadcast Message'}
        </button>
      </div>
    </div>
  );
}


// ============================================
// 4. FUND ALLOCATION COMPONENT
// ============================================

export function FundAllocationTab({ apiCall, vcseOrgs, schools, loadVcseOrgs, loadSchools }) {
  const [organizationType, setOrganizationType] = useState('vcse');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationHistory, setAllocationHistory] = useState([]);

  React.useEffect(() => {
    loadAllocationHistory();
  }, []);
  
  // Stable event handlers using useCallback
  const handleOrgTypeChange = React.useCallback((e) => {
    setOrganizationType(e.target.value);
    setSelectedOrg(''); // Reset selection when type changes
  }, []);
  
  const handleOrgChange = React.useCallback((e) => {
    console.log('[FundAllocation] handleOrgChange called, new value:', e.target.value);
    setSelectedOrg(e.target.value);
  }, []);
  
  const handleAmountChange = React.useCallback((e) => {
    console.log('[FundAllocation] handleAmountChange called, new value:', e.target.value);
    console.log('[FundAllocation] Current selectedOrg before amount change:', selectedOrg);
    setAmount(e.target.value);
  }, [selectedOrg]);
  
  const handleNotesChange = React.useCallback((e) => {
    setNotes(e.target.value);
  }, []);

  const loadAllocationHistory = async () => {
    try {
      const data = await apiCall('/admin/allocation-history');
      setAllocationHistory(data.history || []);
    } catch (error) {
      console.error('Failed to load allocation history:', error);
    }
  };

  const handleAllocate = async () => {
    if (!selectedOrg || !amount) {
      alert('Please select an organization and enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    const org = organizationType === 'vcse' 
      ? vcseOrgs.find(o => o.id === parseInt(selectedOrg))
      : schools.find(o => o.id === parseInt(selectedOrg));

    if (!org) {
      alert('Organization not found');
      return;
    }

    if (!confirm(`Allocate £${amountNum.toFixed(2)} to ${org.organization_name}?`)) {
      return;
    }

    setIsAllocating(true);
    try {
      const data = await apiCall('/admin/allocate-funds', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: selectedOrg,
          organization_type: organizationType,
          amount: amountNum,
          notes
        })
      });

      alert(`Funds allocated successfully!\nOrganization: ${data.organization.name}\nAmount: £${data.organization.allocated_amount.toFixed(2)}\nNew Balance: £${data.organization.new_balance.toFixed(2)}`);
      
      // Clear form
      setSelectedOrg('');
      setAmount('');
      setNotes('');
      
      // Reload data
      loadVcseOrgs();
      loadSchools();
      loadAllocationHistory();
    } catch (error) {
      alert('Failed to allocate funds: ' + error.message);
    } finally {
      setIsAllocating(false);
    }
  };

  const organizations = organizationType === 'vcse' ? vcseOrgs : schools;
  const selectedOrgData = organizations.find(o => o.id === parseInt(selectedOrg));

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>💰 Fund Allocation</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Allocation Form */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '20px' }}>Allocate Funds</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Organization Type</label>
            <select
              value={organizationType}
              onChange={handleOrgTypeChange}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            >
              <option value="vcse">VCSE Organization</option>
              <option value="school">School/Care Organization</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Organization</label>
            <select
              key={`org-select-${organizationType}`}
              value={selectedOrg}
              onChange={handleOrgChange}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            >
              <option value="">-- Select Organization --</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.organization_name} (Balance: £{(org.balance || 0).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {selectedOrgData && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '5px 0' }}><strong>Current Balance:</strong> £{(selectedOrgData.balance || 0).toFixed(2)}</p>
              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {selectedOrgData.email}</p>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount (£)</label>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '18px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
          </div>

          {selectedOrgData && amount && parseFloat(amount) > 0 && (
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '2px solid #4CAF50'
            }}>
              <p style={{ margin: '5px 0', fontSize: '16px' }}>
                <strong>New Balance:</strong> £{((selectedOrgData.balance || 0) + parseFloat(amount)).toFixed(2)}
              </p>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add any notes about this allocation..."
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleAllocate}
            disabled={isAllocating || !selectedOrg || !amount}
            style={{
              padding: '15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: (isAllocating || !selectedOrg || !amount) ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              width: '100%'
            }}
          >
            {isAllocating ? 'Allocating...' : 'Allocate Funds'}
          </button>
        </div>

        {/* Allocation History */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px' }}>
          <h3 style={{ marginBottom: '20px' }}>Allocation History</h3>
          
          {allocationHistory.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>
              No allocation history yet
            </p>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {allocationHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <strong>{item.name}</strong>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      £{item.total_allocated.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>Type: {item.type === 'vcse' ? 'VCSE' : 'School'}</div>
                    <div>Current Balance: £{item.current_balance.toFixed(2)}</div>
                    <div>Email: {item.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
