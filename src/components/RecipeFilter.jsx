import PropTypes from 'prop-types'

export function RecipeFilter({ value, onChange }) {
  return (
    <div className='field'>
      <label htmlFor='filter-author'>Chef</label>
      <input
        id='filter-author'
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Filter by username'
      />
    </div>
  )
}

RecipeFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}
