import PropTypes from 'prop-types'

const FIELD_LABELS = {
  createdAt: 'Created',
  updatedAt: 'Updated',
  likeCount: 'Popularity',
}

export function RecipeSorting({
  fields = [],
  value,
  onChange,
  orderValue,
  onOrderChange,
}) {
  const byPopularity = value === 'likeCount'
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
              {FIELD_LABELS[field] ?? field}
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
          <option value='descending'>
            {byPopularity ? 'Most liked' : 'Newest first'}
          </option>
          <option value='ascending'>
            {byPopularity ? 'Least liked' : 'Oldest first'}
          </option>
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
