//all settings in this file will require restarting the server to apply

//safeguards
export const max_width = 100000
export const max_height = 100000
export const min_mass = 1 //prevent cells having zero or negative mass

//performance settings

//6 = if your arena tends to be 4x more packed than normal
//7 = if your arena tends to have normal density
//8 = if your arena tends to be 4x less packed than normal
// Makes the smallest box for spatial indexing 2^base_physics_box_size units. Setting higher than necessary may result in higher memory usage but setting lower than needed will likely result in very bad performance
export const base_physics_box_size = 6

//socket settings
export const MAX_PACKET_SIZE = 1048576