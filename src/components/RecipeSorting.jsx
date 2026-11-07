import PropTypes from 'prop-types'

export function RecipeSorting({
  fields = [],
  value,
  onChange,
  orderValue,
  onOrderChange,
}) {
  return (
    <>
      <div className='field'>
        <label htmlFor='sortBy'>Sort by</label>
        <select
          id='sortBy'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {fields.map((field) => (
            <option key={field} value={field}>
              {field === 'createdAt' ? 'Created' : 'Updated'}
            </option>
          ))}
        </select>
      </div>
      <div className='field'>
        <label htmlFor='sortOrder'>Order</label>
        <select
          id='sortOrder'
          value={orderValue}
          onChange={(e) => onOrderChange(e.target.value)}
        >
          <option value='descending'>Newest first</option>
          <option value='ascending'>Oldest first</option>
        </select>
      </div>
    </>
  )
}

RecipeSorting.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  orderValue: PropTypes.string.isRequired,
  onOrderChange: PropTypes.func.isRequired,
}
