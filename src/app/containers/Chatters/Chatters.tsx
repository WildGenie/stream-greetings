import * as React from 'react'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import moment from 'moment'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { IChattersRequest, IChattersAction, IChatters, getChatters, addChatters } from '../../redux/modules/chatters/chatters'
import { IStore } from '../../redux/IStore'
import Layout from 'antd/lib/layout'
import Table from 'antd/lib/table'
import Card from 'antd/lib/card'
import Input from 'antd/lib/input'
import Button from 'antd/lib/button'
import notification from 'antd/lib/notification'
import Highlighter from 'react-highlight-words'
import { Spinner } from '../../components'
import _ from 'lodash'
import Icon from 'antd/lib/icon'
import { IConfigsRequest } from '../../redux/modules/configs/configs'
import { INotification } from '../../redux/modules/notifications/notifications'

const { Content } = Layout
const style = require('./Chatters.scss')

interface IProps {
  chatters: IChattersRequest
  configs: IConfigsRequest
  dispatch: Dispatch
  form: any
}

interface IState {
  searchText: string
}

interface IFilter {
  selectedKeys: string[]
  setSelectedKeys: (event: any[]) => void
  confirm: () => {}
  clearFilters: () => {}
}

interface IColumn {
  title: string
  dataIndex: string
  key: string
  sorter?: (a: IChatterTransformed, b: IChatterTransformed) => number
  defaultSortOrder?: 'descend' | 'ascend' | undefined
  className?: string
}

interface IChatterTransformed {
  username: string
  firstChatMessage: string
  latestActionTimestamp: string
  latestActionDate: string
  key: string
}

class ChattersC extends React.Component<IProps, IState> {
  private searchInput: Input | null
  constructor(props: IProps) {
    super(props)

    this.searchInput = null
    this.state = {
      searchText: ''
    }
  }

  public componentDidMount() {
    const { dispatch, configs } = this.props

    getChatters(dispatch, configs.data.profiles.twitch.name)
    window.Streamlabs.onMessage(this.onMessage)
  }

  private onMessage = (event: MessageEvent) => {
    const { dispatch } = this.props

    if (event.type === 'NOTIFICATIONS') {
      const chatters: IChatters = {}
      event.data.forEach((notification: INotification) => {
        chatters[notification.username] = notification.chatter
      })

      addChatters(dispatch, chatters)
    }
  }

  private getColumnSearchProps = (dataIndex: string) => {
    return {
      filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }: IFilter) => (
        <div style={{ padding: 8 }}>
          <Input
            ref={node => {
              this.searchInput = node
            }}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={this.onSetSelectedKeys(setSelectedKeys)}
            onPressEnter={this.handleSearch(selectedKeys, confirm)}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Button
            type="primary"
            onClick={this.handleSearch(selectedKeys, confirm)}
            icon="search"
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Search
          </Button>
          <Button onClick={this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: string, record: any) => (
        record[dataIndex]
          .toString()
          .toLowerCase()
          .includes(value.toLowerCase())
      ),
      onFilterDropdownVisibleChange: (visible: boolean) => {
        if (visible) {
          setTimeout(() => this.searchInput && this.searchInput.select())
        }
      },
      render: (text: string) => (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape={true}
          textToHighlight={(text || '').toString()}
        />
      )
    }
  }

  private handleSearch = (selectedKeys: string[], confirm: () => void) => () => {
    confirm()
    this.setState({ searchText: selectedKeys[0] })
  }

  private onSetSelectedKeys = (setSelectedKeys: (event: any[]) => void) => (e: any) => setSelectedKeys(e.target.value ? [e.target.value] : [])

  private handleReset = (clearFilters: () => void) => () => {
    clearFilters()
    this.setState({ searchText: '' })
  }

  private getColumns = () => {
    const columns: IColumn[] = [
      {
        title: 'Date',
        dataIndex: 'latestActionDate',
        key: 'latestActionDate',
        sorter: (a: IChatterTransformed, b: IChatterTransformed) => (parseInt((b.latestActionTimestamp), 10) - parseInt((a.latestActionTimestamp), 10)),
        defaultSortOrder: 'ascend'
      },
      {
        title: 'Username',
        dataIndex: 'username',
        key: 'username',
        sorter: (a: IChatterTransformed, b: IChatterTransformed) => (a.username.localeCompare(b.username)),
        ...this.getColumnSearchProps('username'),
      },
      {
        title: 'First chat message',
        dataIndex: 'firstChatMessage',
        key: 'firstChatMessage',
        sorter: (a: IChatterTransformed, b: IChatterTransformed) => (a.firstChatMessage).localeCompare(b.firstChatMessage),
      },
      {
        title: 'Replay',
        dataIndex: 'replay',
        key: 'replay',
        className: style.chattersReplay
      }
    ]

    return columns
  }

  private replay = (username: string) => async () => {
    const { chatters } = this.props

    const notif: INotification = {
      username,
      chatter: chatters.data[username],
      timestamp: parseInt(chatters.data[username].firstChatMessageTimestamp || '', 10) || parseInt(chatters.data[username].firstJoinedTimestamp, 10),
      type: chatters.data[username].firstChatMessage ? 'MESSAGE' : 'JOIN'
    }

    try {
      await window.Streamlabs.postMessage('REPLAY', notif)
      notification.open({
        message: 'Notification replay sent',
        icon: <Icon type="smile" style={{ color: '#108ee9' }} />,
      })
    } catch (e) {
      notification.open({
        message: 'An error as occured',
        icon: <Icon type="exclamation-circle" style={{ color: '#ff0000' }} />,
      })
    }
  }

  private tableDataTransformer = (username: string) => {
    const { chatters } = this.props

    return {
      username,
      firstChatMessage: chatters.data[username].firstChatMessage || '',
      latestActionTimestamp: chatters.data[username].firstChatMessageTimestamp || chatters.data[username].firstJoinedTimestamp,
      latestActionDate: moment(parseInt(chatters.data[username].firstChatMessageTimestamp || chatters.data[username].firstJoinedTimestamp, 10)).fromNow(),
      replay: <Icon onClick={this.replay(username)} type="redo" style={{ color: '#108ee9' }} />,
      key: username
    }
  }

  private groupDataByTimeframe = (data: any[], prop: string, timeframe: number, startTime: number, endTime: number) => {
    const sortedData = data.sort((a, b) => a[prop] - b[prop])
    const dataByTimeframe: any = {}
    let currentTime = startTime
    let index = 0

    while (currentTime < endTime) {
      dataByTimeframe[currentTime] = 0
      while (index < sortedData.length && sortedData[index][prop] < startTime) {
        index++
      }

      while (index < sortedData.length && sortedData[index][prop] < currentTime) {
        if (sortedData[index][prop]) {
          dataByTimeframe[currentTime]++
        }

        index++
      }

      currentTime += timeframe
    }

    return dataByTimeframe
  }

  private chartDataTransformer = () => {
    const { chatters } = this.props

    const chattersArray = Object.keys(chatters.data).map((username: string) => {
      return {
        ...chatters.data[username],
        firstJoinedTimestamp: parseInt(chatters.data[username].firstJoinedTimestamp, 10),
        firstChatMessageTimestamp: parseInt(chatters.data[username].firstChatMessageTimestamp || '0', 10),
        username,
      }
    })

    const firstJoinedGroupedData = this.groupDataByTimeframe(chattersArray, 'firstJoinedTimestamp', 60 * 60 * 1000, moment().startOf('day').valueOf(),
            moment().local().endOf('day').valueOf())
    const firstChatMessageGroupedData = this.groupDataByTimeframe(chattersArray, 'firstChatMessageTimestamp', 60 * 60 * 1000, moment().startOf('day').valueOf(),
           moment().local().endOf('day').valueOf())

    return Object.keys(firstJoinedGroupedData).map((timestamp) => ({
      name: moment(parseInt(timestamp, 10)).format('HH:mm'),
      firstNewViewers: firstJoinedGroupedData[timestamp],
      firstNewMessages: firstChatMessageGroupedData[timestamp]
    }))
  }

  public render() {
    const { chatters } = this.props

    return (
      <Content className={style.chatters}>
        <Card className={style.chattersCard}>
          {chatters.isFetching && <Spinner />}
          {chatters.error && <h2>Error loading chatters</h2>}
          {!chatters.isFetching && !chatters.error && <div>
            <h1>Chatters</h1>
            <Table className={style.chattersTable} dataSource={Object.keys(chatters.data).map(this.tableDataTransformer)} columns={this.getColumns()} />
            <ResponsiveContainer height={400} width="100%">
              <LineChart width={730} height={250} data={this.chartDataTransformer()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="linear" dataKey="firstNewViewers" stroke="#8884d8" />
                <Line type="linear" dataKey="firstNewMessages" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>}
        </Card>
      </Content>
    )
  }
}
export const Chatters = connect(
  (state: IStore) => {
    return {
      chatters: state.chatters,
      configs: state.configs
    }
  },
  (d: Dispatch<IChattersAction>) => ({ dispatch: d })
)(ChattersC as any)