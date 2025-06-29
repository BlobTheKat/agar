//all settings in this file will require restarting the server to apply

//safeguards
export const max_width = 100000
export const max_height = 100000
export const min_mass = 1 //prevent cells having zero or negative mass

//performance settings

//6 = if your arena tends to be 4x more packed than normal
//7 = if your arena tends to have normal density
//8 = if your arena tends to be 4x less packed than normal
export const base_physics_box_size = 7

//socket settings
export const MAX_PACKET_SIZE = 1048576