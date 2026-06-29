import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, App as AntApp } from 'antd'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

const antdTheme = {
  token: {
    colorPrimary: '#07163b',
    borderRadius: 10,
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    Table: {
      headerBg: '#fafbfc',
      headerColor: '#6b7280',
      headerSplitColor: 'transparent',
      rowHoverBg: '#f9fafb',
      borderColor: '#f1f2f4',
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      headerBorderRadius: 0,
      fontWeightStrong: 600,
    },
    // Selected filter option = dark navy pill with white text.
    Segmented: {
      itemSelectedBg: '#07163b',
      itemSelectedColor: '#ffffff',
      itemColor: '#5d6470',
      itemHoverColor: '#07163b',
      trackBg: '#f1f2f4',
      borderRadius: 10,
    },
    Select: { borderRadius: 10, controlHeight: 40, optionSelectedBg: '#fffbea' },
    Input: { borderRadius: 10, controlHeight: 40 },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={antdTheme}>
        <AntApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>,
)
