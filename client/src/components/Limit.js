import React from 'react'
import { Stack, Form } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { querryParamNames, limitValues } from '../util/querryParams'

export default function Limit({ limit, setNewValuesOnLimitChange }) {
  const { i18nData } = useLanguage();

  function limitChanged(e) {
    // set new page an limit values
    if (!setNewValuesOnLimitChange([querryParamNames.page, querryParamNames.limit],
      [1, parseInt(e.target.value)])) {
      console.log('Error changing limit');
    }
  }

  return (
    <Stack direction='horizontal' gap={4} className='mb-3 set-limit-stack'>
      <Form.Label className='b'>{convertKeyToSelectedLanguage('limit_p_pg', i18nData)}</Form.Label>
      <Form.Select aria-label='Default select example' className='limit-input'
        onChange={limitChanged} value={limit}>
        {
          limitValues.map((limitValue) => {
            return (
              <option value={limitValue} key={`option_${limitValue}`} >
                {limitValue}
              </option>
            )
          })
        }

      </Form.Select>
    </Stack>
  )
}
