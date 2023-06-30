import React, { useState, useEffect } from 'react'
import { Pagination } from 'react-bootstrap'

export default function PaginationElements({currentPage, totalPages, onPageChange }) {

  const initialNumbers = [];
  for(let i=1; i<=totalPages; i++) {
    initialNumbers.push(i);
  }

  const [numbers, setNumbers] = useState(initialNumbers);
  const [currentButtons, setcurrentButtons] = useState([]);

  useEffect(() => {
    const tempNumbers = [];
    for(let i=1; i<=totalPages; i++) {
      tempNumbers.push(i);
    }
    setNumbers(tempNumbers);
  }, [totalPages]);

  useEffect(() => {
    let tempCurrentButtons = [...numbers]
    // if totalPages < 6 all page numbers will be visible
    if ( totalPages > 6 ) {
      if ( currentPage <= 3 ) {
        tempCurrentButtons = [1, 2, 3, 4 , '...1', totalPages]
      }
      else if ( currentPage === 4 ) {
        const sliced = numbers.slice(0,5)
        tempCurrentButtons = [...sliced, '...1', totalPages] 
      }
      else if ( currentPage > 4 && currentPage < totalPages-3 ) {
        const sliced1 = numbers.slice(currentPage-3, currentPage)
        const sliced2 = numbers.slice(currentPage, currentPage+2)
        tempCurrentButtons = [1, '...1', ...sliced1, ...sliced2, '...2', totalPages]
      }
      else if ( currentPage === totalPages - 3 ) {
        const sliced = numbers.slice(currentPage-2, totalPages)
        tempCurrentButtons = [1, '...1', ...sliced] 
      }
      else if ( currentPage > totalPages - 4 ) {
        const sliced = numbers.slice(totalPages-4)
        tempCurrentButtons = [1, '...1', ...sliced] 
      }
    }

    setcurrentButtons(tempCurrentButtons);
  }, [currentPage, totalPages, numbers]);
  
  return ( currentButtons.length > 1 && 
    <Pagination className='d-flex align-items-center justify-content-center' key='paginationContainer'>
      {currentPage > 1 && 
        <>
          <Pagination.Prev key='prev' onClick={() => {onPageChange(currentPage-1);window.scrollTo(0, 0);}}/>
        </>
      }
      {currentButtons.map( currentNumber => {
        return (
          <span key={`pagination_span_${currentNumber}`}>
          { (currentNumber !== '...1' && currentNumber !== '...2')  &&
            <Pagination.Item key={currentNumber} data-page={currentNumber} 
                active={currentNumber === currentPage} onClick={() => {onPageChange(currentNumber);window.scrollTo(0, 0);}} >
              {currentNumber}
            </Pagination.Item>
          }
          { (currentNumber === '...1' || currentNumber === '...2') &&
            <Pagination.Ellipsis disabled key={currentNumber}/>
          }
          </span>
        )
      })}

      {currentPage < totalPages && 
        <>
          <Pagination.Next key='next' onClick={() => {onPageChange(currentPage+1);window.scrollTo(0, 0);}}/>
        </>
      }
    </Pagination>
  )
}
