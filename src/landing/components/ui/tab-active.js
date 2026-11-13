import { createContext, useContext } from 'react'

export const TabActiveContext = createContext(true)

export const useTabActive = () => useContext(TabActiveContext)
