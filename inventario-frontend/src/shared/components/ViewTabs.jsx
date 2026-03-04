export const ViewTabs = ({ tabs = [], activeTab, onChange }) => {
  return (
    <div className="inline-flex items-center bg-slate-200 rounded-full p-1 gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200
            ${activeTab === tab.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default ViewTabs
