import React, { useState } from 'react';
//import styled from 'styled-components';

import './../styles/tabs.css'

const types = [ 'Authors', 'Images', 'Projects' ]

export const Tab = (props: any) => {
  return (
    <div class="tab-button" onClick={props.onClick}>
        {props.value}
    </div>
  )
}

export const TabGroup = () => {
  const [active, setActive] = useState(types[0])

  return (
    <>
      <div class="button-group">
        {types.map(type => (
          <Tab
            key={type}
            active={active === type}
            onClick={() => setActive(type)}
            value={type}
          />
        ))}
      </div>
      <p />
      <p> Your payment selection: {active} </p>
    </>
  )
}
