export default function cloudinaryLoader({
    src,
    width,
    quality,
}: {
    src: string;
    width: number;
    quality?: number;
}) {
    // If the src is not from Cloudinary, return as is
    if (!src.includes('res.cloudinary.com')) {
        return src;
    }

    // Extract the Cloudinary identifiers
    // Basic URL: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id]
    // We want to insert transformations: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/v[version]/[public_id]

    const params = [
        `w_${width}`,
        'c_limit',
        `q_${quality || 'auto'}`,
        'f_auto',
    ].join(',');

    // Check if there are already transformations in the URL
    if (src.includes('/upload/')) {
        const parts = src.split('/upload/');
        // part[0] is everything before /upload/
        // part[1] is everything after /upload/

        // If there are existing transformations (e.g., /upload/c_fill,h_100/v123...), 
        // we should prepend our automated transformations
        return `${parts[0]}/upload/${params}/${parts[1]}`;
    }

    return src;
}
