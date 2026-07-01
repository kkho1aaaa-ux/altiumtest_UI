export default {
	getSearchTerm: () => {
		return searchInput.text && searchInput.text.trim() !== '' 
			? searchInput.text.trim() 
		: null;
	}
}