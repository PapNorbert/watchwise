import React from 'react'
import { Stack, Form } from 'react-bootstrap'

import useLanguage from '../hooks/useLanguage'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'
import { querryParamNames, limitValues, querryParamDefaultValues } from '../util/querryParams'
import useSetMultipleSearchParams from '../hooks/useSetMultipleSearchParams'

export default function Limit({ limit }) {
  const { i18nData } = useLanguage();
  const [setMultipleSearchParams] = useSetMultipleSearchParams();

  function limitChanged(e) {
    // set new page an limit values
    if (!setMultipleSearchParams(
      [querryParamNames.page, querryParamNames.limit],
      [querryParamDefaultValues.page, parseInt(e.target.value)])
    ) {
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
