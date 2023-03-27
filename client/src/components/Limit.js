import React from 'react'
import { Stack, Form } from 'react-bootstrap'

export default function Limit({limit, setLimit, setPage}) {

  return (
    <Stack direction='horizontal' gap={4} className='mb-3 set-limit-stack'>
      <Form.Label className='b'>Limit per page</Form.Label>
      <Form.Select aria-label='Default select example' className='limit-input' 
          onChange={(e) => {setLimit(e.target.value); setPage(1)}}
          defaultValue={limit}>
        <option value='2'  > 2</option>
        <option value='5'  > 5</option>
        <option value='10' >10</option>
        <option value='15' >15</option>
        <option value='20' >20</option>
        <option value='30' >30</option>
      </Form.Select>
    </Stack>
  )
}
