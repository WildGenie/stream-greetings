// tslint:disable: no-unused-expression

import { expect } from 'chai'
import { renderComponent } from '../../helpers/TestHelper'
import { App } from './App'

describe('<App />', () => {
  const component = renderComponent(App)

  it('Renders with correct style', () => {
    const style = require('./style.scss')
    expect(component.find(style.AppContainer)).to.exist
  })
})
