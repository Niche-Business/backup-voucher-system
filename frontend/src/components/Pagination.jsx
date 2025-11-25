import React from 'react'
import { useTranslation } from 'react-i18next'

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const { t } = useTranslation()
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) return null
  
  const pages = []
  const maxPagesToShow = 5
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  const buttonStyle = {
    padding: '8px 12px',
    margin: '0 4px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  }
  
  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#1976d2',
    color: 'white',
    borderColor: '#1976d2',
    fontWeight: 'bold'
  }
  
  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
    color: '#999'
  }
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      padding: '20px 0',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
      >
        ← {t('pagination.previous')}
      </button>
      
      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} style={buttonStyle}>1</button>
          {startPage > 2 && <span style={{padding: '0 8px'}}>...</span>}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          style={page === currentPage ? activeButtonStyle : buttonStyle}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={{padding: '0 8px'}}>...</span>}
          <button onClick={() => onPageChange(totalPages)} style={buttonStyle}>{totalPages}</button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
      >
        {t('pagination.next')} →
      </button>
      
      <div style={{marginLeft: '20px', fontSize: '14px', color: '#666'}}>
        {t('pagination.page')} {currentPage} {t('pagination.of')} {totalPages} ({totalItems} {t('pagination.totalItems')})
      </div>
    </div>
  )
}

export default Pagination
