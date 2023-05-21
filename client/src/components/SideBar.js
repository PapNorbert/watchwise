import React, { useState } from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';

import BarRightIcon from './icons/BarRightIcon'
import BarLeftIcon from './icons/BarLeftIcon'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import useGetAxios from '../hooks/useGetAxios'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'


export default function SideBar({ children }) {
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);
  const { data: watch_group_names, refetch } =
    useGetAxios(`/api/watch_groups/names?userId=${auth.userID}`);

  function handleSideBarOpened() {
    setCollapsed(false);
    refetch();
  }

  return (
    <>
      {auth.logged_in ?
        <div style={{ display: 'flex', height: '100%', minHeight: '400px' }}>
          <Sidebar width='15%' collapsed={collapsed}
            collapsedWidth='3%' backgroundColor='rgba(0, 0, 0, 0.03)'
          >
            {
              collapsed ?
                <span className='d-flex justify-content-center clickable' onClick={handleSideBarOpened}>
                  <BarRightIcon />
                </span>
                :
                <Menu>
                  <h3 onClick={() => setCollapsed(true)} className='ms-2 clickable' >
                    {convertKeyToSelectedLanguage('chats', i18nData)}
                    <span className='float-end'>
                      <BarLeftIcon />
                    </span>
                  </h3>
                  <span className='ms-2'>
                    {convertKeyToSelectedLanguage('your_chats', i18nData)}
                  </span>
                  {watch_group_names &&
                    (watch_group_names.length > 0 ?
                      watch_group_names.map((wg_name, index) => {
                        // {name: vertex.title, wg_id: vertex._id}
                        return (
                          <MenuItem key={`menu_item_${index}`} className={index === 0 ? 'mt-3' : ''}>
                            {wg_name.name}
                          </MenuItem>
                        )
                      })
                      :
                      <h5>{convertKeyToSelectedLanguage('no_joined_chats', i18nData)}</h5>
                    )
                  }
                </Menu>
            }

          </Sidebar>
          <main
            style={{
              display: 'flex', padding: 10,
              marginLeft: collapsed ? '6%' : '', width: '85%'
            }}
          >
            {children}
          </main>
        </div>
        :
        <main>
          {children}
        </main>
      }
    </>
  )
}
