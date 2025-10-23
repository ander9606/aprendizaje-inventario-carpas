function Card ({title, children}) {

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {title}
            </h3>
            <div>
                {children}
            </div>
        </div>
    )

}

export default Card