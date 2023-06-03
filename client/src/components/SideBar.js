import React, { useState } from 'react'
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';

import BarRightIcon from './icons/BarRightIcon'
import BarLeftIcon from './icons/BarLeftIcon'
import useAuth from '../hooks/useAuth'
import useLanguage from '../hooks/useLanguage'
import useGetAxios from '../hooks/useGetAxios'
import useSocket from '../hooks/useSocket'
import { convertKeyToSelectedLanguage } from '../i18n/conversion'


export default function SideBar({ children }) {
  const { auth } = useAuth();
  const { i18nData } = useLanguage();
  const [collapsed, setCollapsed] = useState(true);
  const { socket, selectedGroupChat, setSelectedGroupChat, setDisplayChatWindow } = useSocket();
  const { data: watch_group_names, refetch } =
    useGetAxios(`/api/watch_groups/names?userId=${auth.userID}`);
  const [openedChat, setopenedChat] = useState([]);

  function handleSideBarOpened() {
    if (collapsed) {
      setCollapsed(false);
      refetch();
    }
  }

  function handleWatchGroupChatClicked(watchGroupShort) {
    if (auth.logged_in) {
      if (selectedGroupChat === null) {
        setSelectedGroupChat(watchGroupShort)
        socket.emit('join_room', { roomKey: watchGroupShort.wg_id, userId: auth.userID, userName: auth.username });
        setDisplayChatWindow(true);
        setopenedChat([...openedChat, watchGroupShort.wg_id]);
      } else {
        // not null
        if (selectedGroupChat.wg_id !== watchGroupShort.wg_id) {
          socket.emit('leave_room', { roomKey: watchGroupShort.wg_id, userId: auth.userID, userName: auth.username });
          setSelectedGroupChat(watchGroupShort)
          socket.emit('join_room', { roomKey: watchGroupShort.wg_id, userId: auth.userID, userName: auth.username  });
          setDisplayChatWindow(true);
          setopenedChat([...openedChat, watchGroupShort.wg_id])
        }
      }
    }
  }

  return (
    <>
      {auth.logged_in ?
        <div style={{ display: 'flex', height: '100%', minHeight: '400px' }}>
          <Sidebar width='15%' collapsed={collapsed}
            collapsedWidth='3%' backgroundColor='rgba(0, 0, 0, 0.03)'
            className={collapsed ? 'clickable' : ''}
            onClick={handleSideBarOpened}
          >
            {
              collapsed ?
                <span className='d-flex justify-content-center'>
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
                      watch_group_names.map((watchGroupShort, index) => {
                        return (
                          <MenuItem key={`menu_item_${index}`} className={index === 0 ? 'mt-3' : ''}
                            onClick={() => handleWatchGroupChatClicked(watchGroupShort)}
                          >
                            {watchGroupShort.name}
                            {watchGroupShort.newMessages && !openedChat.includes(watchGroupShort.wg_id) &&
                              <div className='bold ms-3'>
                                {convertKeyToSelectedLanguage('new_msgs', i18nData)}
                              </div>
                            }
                          </MenuItem>
                        )
                      })
                      :
                      <h5 className='mt-2 p-2'>{convertKeyToSelectedLanguage('no_joined_chats', i18nData)}</h5>
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
