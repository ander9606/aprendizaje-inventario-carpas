import Card from './components/common/Card.jsx'

function App() {
  return (
    <div className='min-h-screen bg-gray-100 p-8'>

      <h1 className='text-3xl font-bold text-gray-800 mb-8'>
        Sistema de inventario de carpas
      </h1>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>

        < Card title="Total de elementos">
          <p className= "text-4xl font-bold text-prymary-600">24</p>
        </Card>

        < Card title="Disponibles">
          <p className= "text-4xl font-bold text-prymary-600">18</p>
        </Card>

        < Card title="Alquilados">
          <p className= "text-4xl font-bold text-prymary-600">06</p>
        </Card>

      </div>

    </div>
  )
}

export default App