import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Container } from 'react-bootstrap';


export default function RecommendationCarousel({ recommendations, className }) {
  const navigate = useNavigate();

  return (
    <Container className={`recommendation-container ${className}`}>
      <Row className='flex-nowrap'>
        {recommendations.map((recommendation) => (
          <Col xs={6} sm={4} md={3} lg={2} key={recommendation.show_key} >
            <Card className='recommendation-item clickable' onClick={() => { navigate(`/${recommendation.show_type}s/${recommendation.show_key}`) }}>
              <Card.Img variant='top'
                src={
                  recommendation.img_name
                    ? recommendation.img_name.includes("http")
                      ? recommendation.img_name
                      : `${process.env.PUBLIC_URL}/covers/${recommendation.img_name}`
                    : `${process.env.PUBLIC_URL}/covers/cover-placeholder.png`
                }
                alt={recommendation.show_name} className='recommendation-image' />
              <Card.Body>
                <Card.Title className='recommendation-name'>
                  {recommendation.show_name}
                </Card.Title>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
