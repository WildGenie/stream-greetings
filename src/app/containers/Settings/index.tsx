import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import JSEncrypt from 'jsencrypt';
import { ISettingsRequest, ISettingsAction, getSettings, setSettings } from '../../redux/modules/settings';
import { IStore } from '../../redux/IStore';
import Card from 'antd/lib/card';
import Input from 'antd/lib/input';
import Switch from 'antd/lib/switch';
import Form from 'antd/lib/form';
import Layout from 'antd/lib/layout';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Slider from 'antd/lib/slider';
import Select from 'antd/lib/select';
import notification from 'antd/lib/notification';
import { Spinner } from '../../components/Spinner';
import { ImageUpload } from '../../components/ImageUpload';
import { AudioUpload } from '../../components/AudioUpload';
import _ from 'lodash';
import { INotification } from '../../redux/modules/notifications';
import { IConfigsRequest } from '../../redux/modules/configs';
import { IEnv } from '../../redux/modules/env';
import { Notification } from '../../components/Notification';
import TextArea from 'antd/lib/input/TextArea';
import { ColorPicker } from '../../components/ColorPicker';

const { Content } = Layout;
const { Option } = Select;
const style = require('./style.scss');

interface IProps {
  settings: ISettingsRequest;
  configs: IConfigsRequest;
  dispatch: Dispatch;
  env: IEnv;
  form: any;
  location: any;
}

interface IState {
  previewVisible: boolean;
  previewImage: string;
  fileList: any[];
}

class SettingsC extends React.Component<IProps, IState> {
  public jsEncrypt: any;

  constructor(props: IProps) {
    super(props);

    this.jsEncrypt = new JSEncrypt();
    this.jsEncrypt.setPublicKey(atob(props.env.PUB_KEY));
  }

  public async componentDidMount() {
    const { dispatch, form, configs } = this.props;

    const settings = await getSettings(dispatch);
    form.setFieldsValue({
      ...settings,
      token: this.jsEncrypt.encrypt(configs.data.token)
    });
  }

  private submit = async (e: React.FormEvent<any>) => {
    const { dispatch, form } = this.props;
    e.preventDefault();

    try {
      const settings = form.getFieldsValue();
      await setSettings(dispatch, settings);
      await window.Streamlabs.postMessage('settings', settings);

      notification.open({
        message: 'Settings saved',
        icon: <Icon type="smile" style={{ color: '#108ee9' }} />,
      });
    } catch (e) {
      notification.open({
        message: 'An error as occured',
        icon: <Icon type="exclamation-circle" style={{ color: '#ff0000' }} />,
      });
    }
  }

  private getTestNotification() {
    const testNotification: INotification = {
      username: 'Spuntagano',
      type: 'MESSAGE',
      chatter: {
        firstJoinedTimestamp: String(new Date().getDate()),
        firstChatMessageTimestamp: String(new Date().getDate()),
        firstChatMessage: 'Like the stream!'
      },
      timestamp: new Date().getDate()
    };

    return testNotification;
  }

  private testNotification = async () => {
    try {
      await window.Streamlabs.postMessage('testNotification', this.getTestNotification());
      notification.open({
        message: 'Test notification sent',
        icon: <Icon type="smile" style={{ color: '#108ee9' }} />,
      });
    } catch (e) {
      notification.open({
        message: 'An error as occured',
        icon: <Icon type="exclamation-circle" style={{ color: '#ff0000' }} />,
      });
    }
  }

  private onImageUpload = (url: string) => {
    const { form } = this.props;

    form.setFieldsValue({
      notificationImageUrl: url
    });
  }

  private onImageRemove = () => {
    const { form } = this.props;

    form.setFieldsValue({
      notificationImageUrl: null
    });
  }

  private onAudioUpload = (url: string) => {
    const { form } = this.props;

    form.setFieldsValue({
      notificationAudioUrl: url
    });
  }

  private onAudioRemove = () => {
    const { form } = this.props;

    form.setFieldsValue({
      notificationAudioUrl: null
    });
  }

  public render() {
    const { settings, form } = this.props;

    const formItemLayout = {
      labelCol: { span: 4 },
      wrapperCol: { span: 6 },
    };

    return (
      <div className={style.Home}>
        <Content className={style.settings}>
          <Card className={style.settingsCard}>
            {settings.isFetching && <Spinner />}
            {settings.error && <h2>Error loading settings</h2>}
            {!settings.isFetching && !settings.error && <div>
              <h1>Settings</h1>
              <Form onSubmit={this.submit} layout="horizontal">
                <Form.Item {...formItemLayout} label="Show Image">
                  {form.getFieldDecorator('showImage', { valuePropName: 'checked' })(<Switch />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Play Sound">
                  {form.getFieldDecorator('playSound', { valuePropName: 'checked' })(<Switch />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Profanity Filter">
                  {form.getFieldDecorator('profanityFilter', { valuePropName: 'checked' })(<Switch />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Show New Viewer Notification">
                  {form.getFieldDecorator('showFirstJoinedNotification', { valuePropName: 'checked' })(<Switch />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Show First Chat Message Notification">
                  {form.getFieldDecorator('showFirstChatMessageNotification', { valuePropName: 'checked' })(<Switch />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Font size">
                  {form.getFieldDecorator('fontSize')(<Slider
                    min={8}
                    max={60}
                  />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Font weight">
                  {form.getFieldDecorator('fontWeight')(<Slider
                    min={100}
                    max={700}
                    step={100}
                  />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Line height">
                  {form.getFieldDecorator('lineHeight')(<Slider
                    min={0.1}
                    max={5}
                    step={0.1}
                  />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Primary color">
                  {form.getFieldDecorator('primaryColor')(<ColorPicker />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Secondary color">
                  {form.getFieldDecorator('secondaryColor')(<ColorPicker />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Font family">
                  {form.getFieldDecorator('fontFamily')(
                    <Select>
                      <Option value="arial">Arial</Option>
                      <Option value="roboto">Roboto</Option>
                      <Option value="oswald">Oswald</Option>
                      <Option value="montserrat">Montserrat</Option>
                      <Option value="open sans">Open Sans</Option>
                    </Select>
                  )}
                </Form.Item>
                <Form.Item {...formItemLayout} label="First Joined Message template">
                  {form.getFieldDecorator('firstJoinedMessageTemplate')(<TextArea
                    autosize={{minRows: 5}}
                   />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="First Time Chatting Message template">
                  {form.getFieldDecorator('firstMessageMessageTemplate')(<TextArea
                    autosize={{minRows: 5}}
                   />)}
                </Form.Item>
                <Form.Item {...formItemLayout} label="Notification image">
                  <ImageUpload
                    imageKey="notificationImage"
                    onSubmit={this.onImageUpload}
                    onRemove={this.onImageRemove}
                    imageUrl={settings.data.notificationImageUrl}
                  />
                </Form.Item>
                <Form.Item {...formItemLayout} label="Notification sound">
                  <AudioUpload
                    audioKey="notificationAudio"
                    onSubmit={this.onAudioUpload}
                    onRemove={this.onAudioRemove}
                    audioUrl={settings.data.notificationAudioUrl} />
                </Form.Item>
                <div className={style.notificationPreview}>
                  <Notification notification={this.getTestNotification()} settings={form.getFieldsValue()} display={true} />
                </div>
                {form.getFieldDecorator('notificationImageUrl')(<Input type="hidden" />)}
                {form.getFieldDecorator('notificationAudioUrl')(<Input type="hidden" />)}
                {form.getFieldDecorator('token')(<Input type="hidden" />)}
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={settings.isSaving}>Save settings</Button>
                  <Button className={style.testNotificationButton} type="default" onClick={this.testNotification}>Test notification</Button>
                </Form.Item>
              </Form>
            </div>}
          </Card>
        </Content>
      </div >
    );
  }
}

export const Settings = connect(
  (state: IStore) => {
    return {
      settings: state.settings,
      configs: state.configs,
      env: state.env
    };
  },
  (d: Dispatch<ISettingsAction>) => ({ dispatch: d })
)(Form.create({ name: 'settings' })(SettingsC as any));
